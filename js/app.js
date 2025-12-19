// SAQ Form Handler
// 供應商稽核問卷表單處理

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('saqForm');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      supplierName: document.getElementById('supplierName').value.trim(),
      contactPerson: document.getElementById('contactPerson').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      questionnaireType: document.getElementById('questionnaireType').value,
      notes: document.getElementById('notes').value.trim(),
    };

    // 簡單驗證
    if (
      !formData.supplierName ||
      !formData.contactPerson ||
      !formData.email ||
      !formData.phone ||
      !formData.questionnaireType
    ) {
      alert('請填寫所有必填欄位 / Please fill in all required fields');
      return;
    }

    // 顯示提交中狀態
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting... / 提交中...';

    // 模擬 API 提交（實際使用時需要連接到後端）
    setTimeout(() => {
      alert('問卷已成功提交！/ Questionnaire submitted successfully!');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Questionnaire / 提交問卷';
    }, 1500);
  });
});

