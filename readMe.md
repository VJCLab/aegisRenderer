# Aegisub Renderer
`span` 과 `div.flex` 엘리먼트를 활용한 `karaoke` 이하 `{\k}` 태그를 오디오와 동기적으로 렌더링 하는 심플한 페이지입니다.  
명령어나 `Automation` 은 파싱 및 렌더링 하지 않습니다.

## 사용된 소스
- [ass-compiler](https://github.com/weizhenye/ass-compiler)
    - 주로 `Dialogue` 또는 `Commant`의 문자열 파싱을 사용함.
- [lrc-file-parser](https://github.com/lyswhut/lrc-file-parser)
    - LRC (싱크가사) 파일의 멀티라인 파싱을 사용함.
- [jsmediatags](https://github.com/aadsm/jsmediatags/)
    - mp3 파일의 태그정보를 파싱하여 이를 통해 앨범 커버 이미지를 추출함.
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
#### 2025-06-06
- 싱크 가사의 배경 색 (하이라이트 되기전 색) 미적용됬었음.
    - 싱크 가사의 배경 색 적용 여부 추가 (기본적으로 활성화됨.)
#### 2025-07-02
- 자막의 글자 태두리가 미적용됨. (ass 스타일 정보가 미반영)
    - OutlineColour 가 있는경우 자동 적용되도록 함. 다만 이는 `box-shadow` 로 구현한것이기에 `aegisub` 와는 다름.
- 자막 애니메이션이 scale fade-in만 있엇음.
    - 투명도 페이드 인 추가. (`자막 설정 > 애니메이션 모드`로 변경가능)
- 업로드된 미디어가 mp3 파일 인경우 앨범 커버을 표시.
    - mp3의  id3 등등 미디어 태그를 추출후 앨범 커버 이미지를 추출하고 이를 `<video poster=""></video>` 로 추가. 기본적으로 화면 상단 가운대 (`50% 1em`) 에 위치함.
    - 포스터의 위치를 수동으로 변경 가능하도록 함.  ( `미디어 설정 > 포스터 위치`로 변경가능)