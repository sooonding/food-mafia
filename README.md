


## 아래 내용은 순차적으로 작성한다.

### ruler
.ruler 먼저 설정

### docs/requirement.md 생성
- 만들 것, 페이지 목록 설정
- "모호한" 문장, 단어가 없어야 한다. 중의적 여지가 없게 짧게 작성


### 문서 작성
- 기존 docs에 prd.md로 작성이 아닌 claude agents를 이용하여 작성한다.

1. .claude/agents로 진입
2. prd-writer.md, userflow-writer.md, database-architect
3. database는 두번 쪼개기도 한다. database-critic도 추가
4. usecase-writer 문서도 작성
5. prompts 폴더를 생성하여 usecase.md, usecasse-write.md,inital-coumentation.md 작성


### 프롬프트 명령어 치기

SCR-20251020-njyv.png

### 페이지 단위 작업 전 공통 작업에 대해서 작성
1. prompt에 common-task-plan.md 작업
2. agents에 common 추가
3. agents에 state-planner에 상태관리, flux등을 붙힌다.






### 명령어
`claude --dangerously-skip-permissions` : 권한없이 쭈욱 진행하라(물어보지 않고 그냥 쭉 작업 진행)


