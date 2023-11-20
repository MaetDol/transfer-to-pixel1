// Typescript  로 만들고 싶었으나, jest.config.ts 를 사용하려면
// node-ts 의존성이 필요하다고 하는군요.
// 설정 파일 타입때문에 의존성을 늘리긴 싫었기에, js 확장자로 작업했습니다

/** @type {import("jest").Config} */
const config = {
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
};

export default config;
