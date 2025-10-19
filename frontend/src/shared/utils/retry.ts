import sleep from "./sleep";

export default async function retry(callback: () => Promise<any>, retries: number = 4, delay: number = 100): Promise<any> {
    try {
        return await callback();
    } catch (error) {
        if (retries === 0) {
            console.warn("Retries exhausted, returning error");
            return Promise.reject(error)
        }
        await sleep(delay);
        return retry(callback, retries - 1, delay * (2 ** retries));
    }
}
