# {프로젝트 명 아직 미정}<br>
### 개요<br>
다수의 커뮤니티 게시판으로부터 게시물을 주기적으로 크롤링하여 DB에 INSERT<br>
<br>
### 사용언어<br>
Node.js 16.15.1<br>
Puppeteer 15.3.0<br>
<br>
### 시작점<br>
bin/www => ../routes/run/index.js의 main() 호출<br>
<br>
### 스크래핑 도구<br>
#### 설명<br>
Chrome 개발팀이 만든 Puppeteer 사용.<br>
Python의 Selenium과 다르게 별도로 chromedriver의 설치가 필요 없음. (모듈에 이미 포함)<br>
chromedriver를 따로 쓰고 싶은 경우 puppeteer-core를 이용하면 됨<br>
<br>
#### 옵션<br>
헤드리스(창 안보임) 모드와 userDataDir 사용 여부 등을 바꾸려면 routes/common/scraping/driver.js를 확인<br>
<br>
#### 주요 메서드<br>
```page.goto(url, {options})```<br>
url로 이동. options로 waitUntil을 사용하는 경우 url로 이동 후 페이지의 로딩을 기다린다.<br>
<br>
```page.setUserAgent(userAgent)```<br>
헤더에 userAgent값을 싣을 수 있음<br>
<br>
```page.url()```<br>
현재 페이지의 url 얻기<br>
<br>
```page.$(selector)```<br>
jQuery의 $와 동일. (단일 객체 찾기) 파라미터로는 선택자(selector)를 제공<br>
<br>
```page.$$(selector)```<br>
jQuery의 $$와 동일. (복수 객체 찾기)<br>
<br>
```page.evaluate()```<br>
찾은 핸들로부터 특정 값(outerHTML, innerHTML, textContent, href 등등)을 가져올 수 있음<br>
<br>
```page.waitForSelector(selector)```<br>
특정 선택자가 로딩될 때까지 기다리기<br>
<br>
### DB<br>
Sequelize와 sqlite 사용<br>
<br>
#### sqlite<br>
In-memory DB라 별도의 접속정보 없음<br>
크롤링 대상 URL 리스트를 임시로 쌓는 용도로 사용(프로그램 종료시 테이블도 소멸됨)<br>
실행 함수 : db/models/sqlite.js<br>
쿼리 경로 : db/query/query_mem.js<br>
<br>
#### Sequelize<br>
접속정보 : routes/db/models/environment.js 참조<br>
사용법 : 쿼리 단위로 원하는 DB를 사용할 수 있게 models에 DB별 인스턴스를 생성해 둠<br>
쿼리 경로 : db/query/query_rdb.js<br>
<br>
### 흐름상 순서<br>
<dl>
<dt>1. 대상 게시판 리스트 가져오기 (target)</dt>
<br>
<dd>테이블 : TB_CRAWL_TARGET</dd>
<dd>조건 : is_used = 'Y'</dd>
<dd>가져올 내용 : seq_no, 커뮤명, 게시판명, URL, 크롤링 주기(분), 게시물간 간격(초)</dd>
<br>
</dl>
<dl>
<dt>2. 크롤링 영역 정보 가져오기 (area) [1.의 seq_no와 일치하는 board_no가 없는 경우 에러]</dt>
<br>
<dd>테이블 : TB_CRAWL_AREA</dd>
<dd>가져올 내용 : 리스트영역, 제목영역, 내용영역, 등록일영역, 등록일포맷, 닉네임영역</dd>
<br>
</dl>
<dl>
<dt>3. 드라이버+페이지 초기화 (driver, page)</dt>
<br>
<dd>게시판 리스트 수만큼 func.init() 호출</dd>
<br>
</dl>
<br>
**(여기서부터 비동기로 분기)**<br>
<dl>
<dt>4. 리스트 수집</dt>
<br>
<dd>func.schedule_loop()로 게시판별 루프 가동.</dd>
<dd>scheduler.js를 통해 각 게시판 URL로 접속 후 게시물 URL 리스트 수집하여 MEM_CRAWL_URL_LIST(메모리 DB)에 INSERT</dd>
<dd>period_time*60*1000 만큼 대기</dd>
<br>
</dl>
<dl>
<dt>5. 게시물 수집</dt>
<br>
<dd>func.scrap_loop()로 스크랩 루프 가동.</dd>
<dd>scrap.js를 통해 MEM_CRAWL_URL_LIST에서 한 건씩 가져와</dd>
<dd>autoScroll로 페이지 끝까지 150px씩 자동 스크롤(동적 로딩 대비)</dd>
<dd>게시물 제목, 내용, 썸네일 경로, 등록일, 닉네임 수집 후 TB_ARTICLE_LIST에 INSERT</dd>
<dd>수집한 이미지는 TB_IMG_LIST에 INSERT</dd>
<dd>MEM_CRAWL_URL_LIST에서 스크랩한 URL은 is_used = 'Y'로 UPDATE</dd>
<br>
</dl>