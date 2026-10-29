import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function themeBootScript() {
  return `try{var t=localStorage.getItem("shiftsense-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}var s=localStorage.getItem("shiftsense-sidebar");if(s==="closed"){document.documentElement.setAttribute("data-sidebar","closed")}else if(window.matchMedia&&window.matchMedia("(max-width:767px)").matches){document.documentElement.setAttribute("data-sidebar","closed")}}catch(e){}`;
}
