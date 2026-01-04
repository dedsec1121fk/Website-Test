
const LOGO_DARK="https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/Black%20Purple%20Butterfly%20Logo.jpeg";
const LOGO_LIGHT="https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/White%20Purple%20Butterfly%20Logo.jpeg";

(function(){
 const theme=localStorage.getItem("theme")||"dark";
 document.documentElement.setAttribute("data-theme",theme);
 document.querySelectorAll("img").forEach(img=>{
   if(img.src.includes("Butterfly")){
     img.src=theme==="light"?LOGO_LIGHT:LOGO_DARK;
   }
 });
})();
