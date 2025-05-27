const COOKIE_DOMAIN = ".manus.im";

function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.style.color = isError ? "red" : "green";
}

// Salvar seção no localStorage
function saveSection(sectionId) {
  const input = document.getElementById("cookieInput").value.trim();
  if (!input) {
    showStatus("O campo JSON está vazio.", true);
    return;
  }

  try {
    const cookies = JSON.parse(input);
    if (!Array.isArray(cookies)) throw new Error("JSON não é uma lista de cookies.");
    localStorage.setItem(`section_${sectionId}`, JSON.stringify(cookies));
    showStatus(`Seção ${sectionId} salva.`);
  } catch (e) {
    showStatus(`JSON inválido: ${e.message}`, true);
  }
}

// Limpar cookies atuais da seção
function clearCookies() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "clearCookies" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
        return;
      }
      if (!response.success) {
        reject(response.error || "Erro desconhecido ao limpar cookies");
        return;
      }
      resolve(response.cleared);
    });
  });
}

// Injetar cookies na aba atual
function setCookies(cookies) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "setCookies", cookies }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
        return;
      }
      if (!response.success) {
        reject(response.error || "Erro desconhecido ao setar cookies");
        return;
      }
      resolve();
    });
  });
}

// Carregar seção: limpa cookies e injeta a nova seção
async function loadSection(sectionId) {
  const json = localStorage.getItem(`section_${sectionId}`);
  if (!json) {
    showStatus(`Seção ${sectionId} vazia.`, true);
    return;
  }

  let cookies;
  try {
    cookies = JSON.parse(json);
    if (!Array.isArray(cookies)) throw new Error("Formato inválido");
  } catch (e) {
    showStatus(`JSON salvo inválido: ${e.message}`, true);
    return;
  }

  showStatus("Carregando seção, aguarde...");
  try {
    await clearCookies();
    await setCookies(cookies);
    // Recarregar a aba atual
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
    });
    showStatus(`Seção ${sectionId} carregada.`);
  } catch (error) {
    showStatus(`Erro ao carregar cookies: ${error}`, true);
  }
}

// Event listeners
document.getElementById("saveSection1").addEventListener("click", () => saveSection(1));
document.getElementById("saveSection2").addEventListener("click", () => saveSection(2));
document.getElementById("loadSection1").addEventListener("click", () => loadSection(1));
document.getElementById("loadSection2").addEventListener("click", () => loadSection(2));
