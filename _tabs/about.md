---
# the default layout is 'page'
icon: fas fa-info-circle
order: 4
---


# About

## Sidebar Background Controls

주제 편집 없이 사이드바 배경을 바꾸고 싶다면 아래 CSS 커스텀 속성을 조정하세요. 모든 속성은 `:root` 또는 원하는 레이아웃에서 다시 정의할 수 있습니다.

| 변수                      | 용도               | 기본값                                                          |
| ------------------------- | ------------------ | --------------------------------------------------------------- |
| `--sidebar-bg-image`      | 불러올 이미지 경로 | `url('/assets/img/sidebar/light-background.png')` (라이트 모드) |
| `--sidebar-bg-size`       | 배경 크기          | `100% auto`                                                     |
| `--sidebar-bg-position`   | 배경 정렬          | `center top`                                                    |
| `--sidebar-bg-attachment` | 스크롤 방식        | `scroll`                                                        |

다크 모드에서는 같은 이름의 변수가 `/_sass/themes/_dark.scss`에 정의되어 있으므로 별도로 조정할 수 있습니다. 이미지를 교체할 때는 자산 폴더(`assets/img/sidebar/`)에 파일을 추가한 뒤 위 변수를 새 경로로 업데이트하면 됩니다.

## PDF 출력 버튼

각 포스트에는 “Print or save as PDF” 버튼이 추가되어 브라우저 인쇄 대화상자에서 바로 PDF로 저장할 수 있습니다. 관련 스타일은 `@media print` 규칙으로 처리되어 읽기 전용 PDF 페이지가 깔끔하게 정리됩니다.

## 읽기 시간 배지

읽기 시간 배지는 단어 수와 예상 소요 시간을 동시에 표시하며, 스크롤 위치에 따라 읽은 비율을 실시간으로 업데이트합니다. 추가적인 커스터마이징은 `_includes/read-time.html`과 `assets/js/scroll-progress.js`에서 가능합니다.

- ETA(완독 예상 시간)도 자동으로 계산되어 현재 시간을 기준으로 한 종료 시각을 보여 주며, 브라우저 언어권에 맞춰 시각 형식이 출력됩니다.
- 화면 우측 하단에는 진행률과 남은 시간을 동시에 보여 주는 떠 있는 알림(pill)이 추가되어, 어디서든 현재 읽기 진행도를 확인할 수 있습니다.

## 읽기 모드

탑바 우측에 있는 책 아이콘을 누르면 사이드바·패널이 숨겨지고 본문 폭이 확대되는 집중 모드가 활성화됩니다. 브라우저마다 `localStorage`에 상태가 저장되므로, 같은 장치에서는 새로고침 후에도 읽기 모드가 유지됩니다.
