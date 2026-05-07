function copyToken() {
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) {
    navigator.clipboard.writeText(token).then(() => {
      alert('JWT token copied to clipboard!');
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('googleAuthBtn');
  const status = document.getElementById('status');
  const tokenDisplay = document.getElementById('tokenDisplay');
  const tokenBox = document.getElementById('tokenBox');
  const userInfo = document.getElementById('userInfo');

  btn.addEventListener('click', function() {
    btn.disabled = true;
    status.textContent = 'Redirecting to Google...';
    status.className = 'status loading';
    window.location.href = '/auth/google';
  });

  const params = new URLSearchParams(window.location.search);

  if (params.has('token')) {
    const token = params.get('token');
    const email = params.get('email');
    const name = params.get('name');

    btn.style.display = 'none';
    status.style.display = 'none';
    tokenDisplay.style.display = 'block';

    userInfo.innerHTML = `<div>Signed in as: <strong>${name}</strong></div><div style="font-size: 11px; color: #666;">${email}</div>`;
    tokenBox.textContent = token;
  } else if (params.has('error')) {
    const error = params.get('error');
    status.textContent = `✗ Authorization failed: ${error}`;
    status.className = 'status error';
  }
});
