## 명령어 한줄로 환경 구성하기
```
curl "https://github.com/MaetDol/transfer-to-pixel1/blob/master/init?raw=true" -L | sh
```
위 명령어는 아래와 같은 일련의 순서를 거칩니다
1. git, nodejs, termux-api 패키지를 설치합니다
2. 현재 레포지토리를 복제합니다
3. 끝!(TODO: 사진 경로 및 서버 URL, 그리고 마지막 업데이트 날짜를 고를 수 있게 수정이 필요합니다)
---

git pull, 또는 소스 다운받고 해야할 것

- properties.json 의 server, port 수정
- last_update 수정
- base_url 수정
- server_root 수정
- log_dir 
- 구글 포토, termux 배터리 최적화 끄기

## ignore 작성 규칙

경로의 끝에 `/`가 포함된 경우, 디렉토리로 인식합니다 \
`/`로 시작하지 않는 경우
- 파일의 경우 경로 상관없이 일치하는 파일을 의미합니다
- 디렉토리의 경우, 경로 상관없이 일치하는 디렉토리을 의미합니다.
`*`는 아무 문자나, 여러개를 의미합니다 \
`**`는 아무경로를 의미합니다 \
