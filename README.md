## 變更日誌 (Changelog)

- **日期/時間**: 2026-05-23 16:45
- **變更類型**: [UI優化 / Debug]
- **詳細內容**: 
  - 修改了 `components/SummaryCards.tsx`: 修復「較低息方案」標籤擋住 H-Plan/P-Plan 標題文字的問題。將標籤的 CSS 定位由 `-top-3` 調整為 `-top-6`，增加上方垂直間距，避免重疊。
  - **狀態**: [⚠️ 注意：已確認未刪除任何舊有功能]

- **日期/時間**: 2026-05-23 16:35
- **變更類型**: [UX優化]
- **詳細內容**: 
  - 修改了 `components/TermsModal.tsx`: 
    - 優化了「不同意並離開」的行為，由 `window.location.href` 改為 `window.location.replace`，確保跳轉至 Google 後，使用者無法透過瀏覽器「上一頁」返回應用程式。
  - **狀態**: [⚠️ 注意：已確認未刪除任何舊有功能]

- **日期/時間**: 2026-05-23 16:30
- **變更類型**: [UI優化 / Debug / 合規更新]
- **詳細內容**: 
  - 修改了 `App.tsx`: 將免責聲明視窗 (`TermsModal`) 的初始狀態設為 `true`，確保應用程式載入時自動彈出，符合合規要求。
  - 修改了 `components/TermsModal.tsx`: 
    - 移除了標題列的關閉按鈕，強制使用者進行選擇。
    - 新增「不同意並離開」按鈕，點擊後導向 Google 首頁。
    - 將確認按鈕文字更新為「同意並繼續」，明確表達使用者意願。
  - 修改了 `components/InputForm.tsx`: 修復了 props 解構中的 `partialRepaymentAmount` 重複定義語法錯誤。
  - **狀態**: [⚠️ 注意：已確認未刪除任何舊有功能]
