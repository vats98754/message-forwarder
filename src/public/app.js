// Minimal JS to handle form submissions
document.addEventListener('DOMContentLoaded', () => {
  // SMS form
  const smsForm = document.getElementById('sms-form');
  const smsStatus = document.getElementById('sms-status');

  smsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    smsStatus.textContent = 'Sending...';
    const from = document.getElementById('sms-from').value;
    const body = document.getElementById('sms-body').value;
    try {
      const resp = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ From: from, Body: body })
      });
      if (resp.ok) {
        smsStatus.textContent = 'SMS forwarded!';
      } else {
        smsStatus.textContent = 'Error forwarding SMS';
      }
    } catch (err) {
      console.error(err);
      smsStatus.textContent = 'Network error';
    }
  });

  // Email form
  const emailForm = document.getElementById('email-form');
  const emailStatus = document.getElementById('email-status');

  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailStatus.textContent = 'Sending...';
    const from = document.getElementById('email-from').value;
    const subject = document.getElementById('email-subject').value;
    const text = document.getElementById('email-text').value;
    try {
      const resp = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, subject, text })
      });
      if (resp.ok) {
        emailStatus.textContent = 'Email forwarded!';
      } else {
        emailStatus.textContent = 'Error forwarding email';
      }
    } catch (err) {
      console.error(err);
      emailStatus.textContent = 'Network error';
    }
  });
});
