
const LOGO_DARK = "https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/Black%20Purple%20Butterfly%20Logo.jpeg";
const LOGO_LIGHT = "https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/White%20Purple%20Butterfly%20Logo.jpeg";

const logo = document.getElementById("logo");

function applyTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  logo.src = prefersDark ? LOGO_DARK : LOGO_LIGHT;
}

applyTheme();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
