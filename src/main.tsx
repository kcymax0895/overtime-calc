import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Service Worker 자동 등록 (PWA 설치 및 오프라인 지원)
registerSW({
    onNeedRefresh() {
        // 새 버전 감지 시 자동 업데이트
    },
    onOfflineReady() {
        console.log('야근계산기: 오프라인 사용 가능 상태입니다.');
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
