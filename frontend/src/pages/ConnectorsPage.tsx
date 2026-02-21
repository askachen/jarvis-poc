import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { outlookApi, OutlookConnector, OutlookEmail } from '../api/outlook';
import toast from 'react-hot-toast';

export function ConnectorsPage() {
  const [connector, setConnector] = useState<OutlookConnector | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emails, setEmails] = useState<OutlookEmail[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    outlookApi.getStatus()
      .then((data) => setConnector(data))
      .catch(() => setConnector(null))
      .finally(() => setLoading(false));
  }, []);

  const handleConnectMock = async () => {
    setConnecting(true);
    try {
      const result = await outlookApi.connectMock(emailInput || undefined);
      setConnector(result);
      setShowEmailInput(false);
      setEmailInput('');
      toast.success('Outlook (Mock) 已連接');
    } catch {
      toast.error('連接失敗，請重試');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('確定要中斷 Outlook 連接？')) return;
    try {
      const result = await outlookApi.disconnect();
      setConnector(result);
      setEmails([]);
      setShowPreview(false);
      toast.success('已中斷連接');
    } catch {
      toast.error('操作失敗，請重試');
    }
  };

  const handlePreviewToggle = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    setPreviewLoading(true);
    try {
      const data = await outlookApi.previewEmails();
      setEmails(data);
      setShowPreview(true);
    } catch {
      toast.error('無法載入郵件預覽');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connectors</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Connect external services to enrich your scheduled tasks with real-time data.
              </p>
            </div>

            {/* Outlook Connector Card */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 4.5A3 3 0 0 0 4.5 7.5v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-9Zm0 1.5h9a1.5 1.5 0 0 1 1.5 1.5v.75L12 11.25 4.5 8.25V7.5A1.5 1.5 0 0 1 7.5 6Zm-3 3.6 7.13 2.85a.75.75 0 0 0 .54 0L19.5 9.6v6.9a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V9.6Z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Outlook / Microsoft 365</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    讓排程任務自動讀取收件匣，摘要或分析郵件內容
                  </p>
                </div>
                {!loading && connector?.connected && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    已連接 (Mock 模式)
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {loading ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">載入中...</p>
                ) : connector?.connected ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-gray-400 dark:text-gray-500">帳號：</span>
                      <span className="font-medium">{connector.displayEmail || '（未指定）'}</span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handlePreviewToggle}
                        disabled={previewLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium border
                          border-gray-300 dark:border-gray-600
                          text-gray-700 dark:text-gray-300
                          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                          disabled:opacity-50"
                      >
                        {previewLoading ? '載入中...' : showPreview ? '隱藏信件' : '預覽信件'}
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="px-4 py-2 rounded-lg text-sm font-medium
                          text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800
                          hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        中斷連接
                      </button>
                    </div>

                    {/* Email Preview Panel */}
                    {showPreview && emails.length > 0 && (
                      <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            最近 {emails.length} 封郵件（Mock 資料）
                          </p>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                          {emails.map((email) => (
                            <div key={email.id} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {email.subject}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {email.fromName} &lt;{email.from}&gt;
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    {email.bodyPreview}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {new Date(email.receivedAt).toLocaleDateString('zh-TW')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      連接 Outlook 後，含有「email」、「信件」、「收件匣」等關鍵字的排程任務將自動注入最新郵件摘要。
                    </p>

                    {showEmailInput ? (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="輸入顯示用 Email（選填）"
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                        />
                        <button
                          onClick={handleConnectMock}
                          disabled={connecting}
                          className="px-4 py-2 rounded-lg text-sm font-medium
                            bg-indigo-600 hover:bg-indigo-700 text-white transition-colors
                            disabled:opacity-50"
                        >
                          {connecting ? '連接中...' : '確認'}
                        </button>
                        <button
                          onClick={() => { setShowEmailInput(false); setEmailInput(''); }}
                          className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400
                            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowEmailInput(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium
                          bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                      >
                        Connect Outlook (Mock)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Info callout */}
            <div className="flex gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20
              border border-blue-100 dark:border-blue-800">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Real Azure AD OAuth will be available in a future update. Mock mode uses sample emails
                to simulate the integration without requiring an Azure account.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
