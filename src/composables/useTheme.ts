import { ref } from "vue"

/**
 * Same contract as rs256.net: a .dark class on <html> and the "theme" key in
 * localStorage. Because the tool is served from the same origin, switching the
 * theme here carries over to the parent site and back.
 */

const isDark = ref( document.documentElement.classList.contains( "dark" ) )

export const useTheme = () => ( {
  isDark,
  toggle: () => {
    isDark.value = document.documentElement.classList.toggle( "dark" )
    localStorage.setItem( "theme", isDark.value ? "dark" : "light" )
  }
} )
