```
curl "https://github.com/MaetDol/transfer-to-pixel1/blob/master/init?raw=true" | sh
```


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
