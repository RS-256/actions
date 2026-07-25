import JSZip from "jszip"
import type { GeneratedFile } from "../types/config"

export const ZIP_FILENAME = "github-actions-templates.zip"

/** Keeps the .github/ directory structure, so the zip can be unpacked at the repository root. */
export const createZip = async ( files: GeneratedFile[] ): Promise< Blob > => {
  const zip = new JSZip()
  for ( const file of files ) zip.file( file.path, file.content )
  return zip.generateAsync( { type: "blob" } )
}

export const downloadBlob = ( blob: Blob, filename: string ): void => {
  const url = URL.createObjectURL( blob )
  const anchor = document.createElement( "a" )
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL( url )
}

export const downloadText = ( text: string, filename: string ): void => {
  downloadBlob( new Blob( [ text ], { type: "text/yaml;charset=utf-8" } ), filename )
}
