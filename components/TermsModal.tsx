import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLeave = () => {
      // Redirect to Google and replace history to prevent back navigation
      window.location.replace('https://www.google.com');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header - No Close Button for Gatekeeper Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">免責聲明及使用條款</h2>
          {/* Close button removed to enforce decision */}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4">
            <section>
                <h3 className="font-bold text-slate-800 mb-1">一般參考性質</h3>
                <p>本網站／應用程式所載之所有資料及計算結果（包括但不限於按揭供款模擬、壓力測試結果、利率預測）僅供一般參考用途。儘管我們已盡力確保資料準確，但網站持有人及開發者並不保證該等資料的準確性、完整性或時效性。</p>
            </section>
            
            <section>
                <h3 className="font-bold text-slate-800 mb-1">非財務建議</h3>
                <p>本工具並非由持牌財務顧問提供，內容亦不構成任何要約、招攬、建議或推薦。閣下在作出任何置業或按揭決定前，應自行核實所有資料，並諮詢銀行職員、律師或專業財務顧問的意見。</p>
            </section>

            <section>
                <h3 className="font-bold text-slate-800 mb-1">銀行最終批核</h3>
                <p>所有的按揭計劃、利率（P按/H按）、回贈及罰息期條款，均以相關銀行或財務機構最終批出的「貸款確認書」（Facility Letter）為準。市場利率（如 HIBOR）隨時波動，本模擬器無法預測未來利率走勢。</p>
            </section>

            <section>
                <h3 className="font-bold text-slate-800 mb-1">責任限制</h3>
                <p>閣下須自行承擔使用本網站的風險。對於因依賴本網站內容而引致的任何直接、間接或相應而生的損失（包括但不限於金錢損失、資料遺失），網站持有人、開發者及相關人員概不負上任何法律責任。</p>
            </section>
        </div>

        {/* Footer with Confirm or Leave actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button 
            onClick={handleLeave}
            className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
          >
            不同意並離開
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            同意並繼續
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;