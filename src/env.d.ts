/// <reference types="vite/client" />

declare module "*.yaml" {
  const data: Record< string, unknown >
  export default data
}

declare module "*.vue" {
  import type { DefineComponent } from "vue"

  const component: DefineComponent< Record< string, unknown >, Record< string, unknown >, unknown >
  export default component
}
