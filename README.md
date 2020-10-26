<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

  
  <p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for building efficient and scalable server-side applications, heavily inspired by <a href="https://angular.io" target="blank">Angular</a>.</p>
    <p align="center">

<br>
<p align="center">
  <a href="https://azure.microsoft.com/ko-kr/" target="blank"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Microsoft_Azure_Logo.svg/800px-Microsoft_Azure_Logo.svg.png" width="320", alt="Azure Logo"></a>
</p>
<p align="center">
<a href="https://azure.microsoft.com/" target="blank">Microsoft Azure</a>의 오픈 소스 <a href="https://docs.microsoft.com/azure", target="blank">설명서</a>에 오신 것을 환영합니다. Microsoft Azure 설명서에 기여할 수 있는 방법을 이해하려면 이 README 파일을 살펴보세요.
</p>
<br>

## Description

Azure Media Service SDK for javascript를 활용한 [Nest](https://github.com/nestjs/nest) Framework로 Live Streaming API 서버 만들기!


## Todo List
- [x] Media Service 연결 및 작동 Test
- API 나누기
  - [x] Init
    - [x] Azure Credentail 획득
    - [x] Media Service 연결
    - [x] Live Event 확인 및 생성
    - [x] Asset 확인 및 생성
    - [x] Live Output 확인 및 생성
    - [x] Streaming Locator 확인 및 생성
    - [x] Streaming End Point 확인 및 생성
    - [ ] 시작되고있는 경우 종료해줄것

  - [x] Start
    - [x] Live Event 시작
    - [x] Live Output 시작
    - [x] Streaming End Point 시작

  - [x] Stop
    - [x] Streaming End Point 종료
    - [x] Live Output 종료
      - live event 종료시 자동으로 stop
    - [x] Live Event 종료

  - [ ] Remove
    - [ ] Live Event 확인 및 제거
    - [ ] Asset 확인 및 제거
    - [ ] Live Output 확인 및 제거
    - [ ] Streaming Locator 확인 및 제거
    - [ ] Streaming End Point 확인 및 제거