export interface OutlookEmail {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  receivedAt: string;   // ISO string
  bodyPreview: string;  // ~200 char snippet
}

export function hasEmailKeywords(prompt: string): boolean {
  return /outlook|email|郵件|信件|收件匣|inbox|mail|電子郵件/i.test(prompt);
}

const MOCK_EMAILS: OutlookEmail[] = [
  {
    id: '1',
    fromName: '王大明',
    from: 'wang.daming@company.com',
    subject: '[工程部] 本週進度週報 W08',
    receivedAt: '2026-02-19T09:15:00Z',
    bodyPreview: '各位好，以下為本週工程部進度摘要：前端模組已完成 80%，後端 API 測試中，預計下週五交付...',
  },
  {
    id: '2',
    fromName: '陳美玲',
    from: 'chen.meiling@company.com',
    subject: '會議邀請: Q1 策略討論 — 2/21 下午 2:00',
    receivedAt: '2026-02-19T08:30:00Z',
    bodyPreview: '邀請您參加 Q1 業務策略討論會議，地點：11F 會議室 B，議程包含市場分析、產品路線圖規劃...',
  },
  {
    id: '3',
    fromName: '供應商 - 鴻昇科技',
    from: 'sales@hongshen-tech.com',
    subject: 'RE: 設備採購報價單 #QT-2026-089',
    receivedAt: '2026-02-18T16:45:00Z',
    bodyPreview: '您好，依您需求提供最新報價如下：服務器 x3 共 NT$285,000，含一年保固與到府安裝...',
  },
  {
    id: '4',
    fromName: 'IT 資安團隊',
    from: 'security@company.com',
    subject: '【重要】請於 2/28 前更新您的 MFA 設定',
    receivedAt: '2026-02-18T10:00:00Z',
    bodyPreview: '全體同仁您好，為配合資安政策升級，請於 2/28 前至員工入口網站更新多因素驗證設定...',
  },
  {
    id: '5',
    fromName: '林志豪',
    from: 'lin.zhihao@company.com',
    subject: 'Jarvis POC 驗收測試安排',
    receivedAt: '2026-02-18T09:20:00Z',
    bodyPreview: 'Hi，關於 Jarvis POC 驗收測試，預計安排在 2/25（三）上午 10 點，請確認是否方便參加...',
  },
  {
    id: '6',
    fromName: 'HR 人資部',
    from: 'hr@company.com',
    subject: 'RE: 年假申請 — 已核准',
    receivedAt: '2026-02-17T14:30:00Z',
    bodyPreview: '您的年假申請（2/24-2/25，共 2 天）已由主管核准，系統已自動更新出勤記錄...',
  },
  {
    id: '7',
    fromName: 'GitHub',
    from: 'notifications@github.com',
    subject: '[jarvis-poc] PR #42: Add Outlook connector feature',
    receivedAt: '2026-02-17T11:00:00Z',
    bodyPreview: '@user requested your review on PR #42. Changes: +847 -23 lines across 9 files...',
  },
  {
    id: '8',
    fromName: 'Jira',
    from: 'jira@atlassian.net',
    subject: '[JARVIS-156] New comment: Scheduler timezone bug',
    receivedAt: '2026-02-17T09:45:00Z',
    bodyPreview: '張小華 commented: "Confirmed on staging. The cron fires at wrong time — likely UTC vs CST issue..."',
  },
];

export async function fetchOutlookEmails(
  connector: { mockMode: boolean; accessToken?: string | null }
): Promise<OutlookEmail[]> {
  if (connector.mockMode) return MOCK_EMAILS;
  // Future: call https://graph.microsoft.com/v1.0/me/messages with accessToken
  throw new Error('Real OAuth not yet implemented');
}

export function formatEmailsForPrompt(emails: OutlookEmail[]): string {
  const lines = emails.map((e, i) => {
    const date = new Date(e.receivedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    return `${i + 1}. 寄件者: ${e.fromName} <${e.from}> | 時間: ${date}\n   主旨: ${e.subject}\n   摘要: ${e.bodyPreview}`;
  });
  return `[Outlook 收件匣 — 最近 ${emails.length} 封郵件]\n${lines.join('\n\n')}\n[以上為郵件資料，請根據下方指示處理]\n`;
}
