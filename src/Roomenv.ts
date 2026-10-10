/* 部屋の温度・湿度を取得するAPI */

import { Hono } from 'hono';
import { env } from 'hono/adapter';

type AdafruitData = {
    value: string;
    created_at: string;
};

// ESP32 は60秒ごとに送信している。3回分 (3分) 届かなければオフラインとみなす
const STALE_THRESHOLD_MS = 3 * 60 * 1000;

export const roomEnv = new Hono().get('/roomEnv', async (c) => {
    const { ADAFRUIT_IO_USERNAME } = env<{ ADAFRUIT_IO_USERNAME: string }>(c);
    const { ADAFRUIT_IO_KEY } = env<{ ADAFRUIT_IO_KEY: string }>(c);

    // ESP32 側で送信しているフィード名
    const temperatureUrl = `https://io.adafruit.com/api/v2/${ADAFRUIT_IO_USERNAME}/feeds/temperature/data/last`;
    const humidityUrl = `https://io.adafruit.com/api/v2/${ADAFRUIT_IO_USERNAME}/feeds/humidity/data/last`;

    const headers = {
        'X-AIO-Key': ADAFRUIT_IO_KEY,
    };

    try {
        // 温度と湿度を並列で取得
        const [temperatureRes, humidityRes] = await Promise.all([
            fetch(temperatureUrl, { method: 'GET', headers }),
            fetch(humidityUrl, { method: 'GET', headers }),
        ]);

        // フィードがまだ無い = ESP32 から一度もデータが届いていない
        if (temperatureRes.status === 404 || humidityRes.status === 404) {
            return c.json(
                {
                    success: 'false',
                    message: 'ESP32からデータがまだ届いていません。',
                },
                503
            );
        }

        if (!temperatureRes.ok || !humidityRes.ok) {
            return c.json(
                {
                    success: 'false',
                    message: '温度・湿度を取得できませんでした。',
                },
                502
            );
        }

        const temperatureData = (await temperatureRes.json()) as AdafruitData | null;
        const humidityData = (await humidityRes.json()) as AdafruitData | null;

        // フィードはあるがデータが空
        if (!temperatureData?.created_at || !humidityData?.created_at) {
            return c.json(
                {
                    success: 'false',
                    message: 'ESP32からデータがまだ届いていません。',
                },
                503
            );
        }

        // 古い方の時刻で鮮度を判定 (どちらか片方でも止まっていればオフライン扱い)
        const temperatureAt = new Date(temperatureData.created_at).getTime();
        const humidityAt = new Date(humidityData.created_at).getTime();
        const oldestAt = Math.min(temperatureAt, humidityAt);
        const elapsedMs = Date.now() - oldestAt;

        if (elapsedMs > STALE_THRESHOLD_MS) {
            return c.json(
                {
                    success: 'false',
                    message: 'ESP32からデータが届いていません。電源やネットワークを確認してください。',
                    lastUpdatedAt: new Date(oldestAt).toISOString(), // 最後に届いた時刻 (UTC)
                    elapsedSeconds: Math.floor(elapsedMs / 1000),
                },
                503
            );
        }

        return c.json(
            {
                success: 'success',
                message: '温度・湿度を取得しました！',
                data: {
                    temperature: Number(temperatureData.value), // ℃
                    humidity: Number(humidityData.value), // %
                    updatedAt: temperatureData.created_at, // 最終更新時刻 (UTC, ISO 8601)
                },
            },
            200
        );
    } catch (e) {
        return c.json(
            {
                success: 'false',
                message: 'サーバーエラーが発生しました。',
            },
            500
        );
    }
});
