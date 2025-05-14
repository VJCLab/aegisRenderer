// webworker spower
class WorkerSpown extends EventTarget {
    constructor() {
        super();
        this.worker = null;
    }

    async parse(text) {
        try {
            // 이미 생성된 워커가 있으면 종료
            this.terminate();

            // 새 워커 생성
            this.worker = new Worker(new URL('./parse.js', import.meta.url), {
                type: 'module'
            });
            // 워커로부터의 응답을 기다리는 Promise 생성 및 즉시 await
            const result = await new Promise((resolve, reject) => {
                this.worker.onmessage = (e) => {
                    const { type, progress, result } = e.data;

                    if (type === 'progress') {
                        // progress 이벤트 발생
                        this.dispatchEvent(new ProgressEvent('progress', progress));
                    } else if (type === 'done') {
                        resolve(result);
                    }
                };

                this.worker.onerror = (e) => {
                    const err = new Error(e.message);
                    err.name = `ASSParserError`;
                    reject(err);
                };

                // 워커에 파싱할 텍스트 전송
                this.worker.postMessage(text);
            }).catch(e => { throw e });

            // 작업 완료 후 워커 종료
            this.terminate();

            return result;
        } catch (error) {
            throw error;
        }
    }

    // 리소스 정리
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export default new WorkerSpown();