// background.js

const COOKIE_DOMAIN = ".manus.im";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "clearCookies") {
    chrome.cookies.getAll({ domain: COOKIE_DOMAIN }, (cookies) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      if (cookies.length === 0) {
        sendResponse({ success: true, cleared: 0 });
        return;
      }

      let removedCount = 0;
      for (const cookie of cookies) {
        // Construir URL para remover o cookie (precisa de protocolo + domínio + caminho)
        const url = (cookie.secure ? "https://" : "http://") + cookie.domain.replace(/^\./, "") + cookie.path;
        chrome.cookies.remove({ url, name: cookie.name }, () => {
          removedCount++;
          if (removedCount === cookies.length) {
            sendResponse({ success: true, cleared: removedCount });
          }
        });
      }
    });
    return true; // async response
  }

  if (request.action === "setCookies") {
    const cookies = request.cookies;
    if (!Array.isArray(cookies)) {
      sendResponse({ success: false, error: "Lista de cookies inválida" });
      return;
    }

    let setCount = 0;
    let hasError = false;

    for (const c of cookies) {
      // Ajuste sameSite para chrome.cookies API (pode ser 'no_restriction', 'lax', 'strict' ou undefined)
      let sameSite = c.sameSite;
      if (sameSite === "no_restriction") sameSite = undefined;

      // Montar URL para setar cookie, obrigatória para chrome.cookies.set()
      const url = (c.secure ? "https://" : "http://") + c.domain.replace(/^\./, "") + c.path;

      try {
        chrome.cookies.set({
          url,
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: sameSite,
          expirationDate: c.expirationDate
        }, (cookie) => {
          if (chrome.runtime.lastError) {
            console.error("Erro ao setar cookie", c.name, chrome.runtime.lastError.message);
            hasError = true;
          }
          setCount++;
          if (setCount === cookies.length) {
            sendResponse({ success: !hasError, error: hasError ? "Erro ao setar alguns cookies" : null });
          }
        });
      } catch (e) {
        console.error("Exceção ao setar cookie", c.name, e);
        setCount++;
        hasError = true;
        if (setCount === cookies.length) {
          sendResponse({ success: !hasError, error: hasError ? "Erro ao setar alguns cookies" : null });
        }
      }
    }
    return true; // async
  }

  sendResponse({ success: false, error: "Ação desconhecida" });
});
