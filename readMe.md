# Aegisub Renderer
`span` 과 `div.flex` 엘리먼트를 활용한 `karaoke` 이하 `{\k}` 태그를 오디오와 동기적으로 렌더링 하는 심플한 페이지입니다.  
명령어나 `Automation` 은 파싱 및 렌더링 하지 않습니다.

## 사용된 소스
- [ass-compiler](https://github.com/weizhenye/ass-compiler)
    - 주로 `Dialogue` 또는 `Commant`의 문자열 파싱을 사용함.
- [lrc-file-parser](https://github.com/lyswhut/lrc-file-parser)
    - LRC (싱크가사) 파일의 멀티라인 파싱을 사용함.

## build footprint
#### 2025-05-14
- `worker` 파일 삭제 및 통합
    - 파싱은 `parse`, 변환은 `convert`로 정리함.
- `lrc` 변환 자체를 `Webworker`로 만듬.
- 오디오 플레이어를 설정에서 메인 화면으로 내보냄.
#### 2025-05-15
- GUI class 를 삭제 후 함수 분할.
- 기존 오디오만 지원하던걸 비디오도 지원하도록 확장.
    - audio 를 video 로 바꿈.
#### 2025-05-23
- 자막이 화면 전체를 가려서 컨트롤러 작동 방해가 있었음.
    - `자막 설정 > 하단 위치 조절` 에서 이를 수동 변경 가능하게함