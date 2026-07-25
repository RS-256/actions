// Fails if any tracked file outside the allowlist contains non-ASCII characters.
// See design doc 12: hand-written source must stay ASCII-only. Everything that is
// data (dictionaries), prose (docs, readme) or generated (dogfooded workflows,
// snapshots) is exempt.
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const ALLOWLIST = [
  /^src\/assets\/lang\/.+\.yaml$/, // language dictionaries
  /^docs\//, // spec and design docs (md, for humans)
  /^README(\..+)?\.md$/, // human-facing readme
  /^LICENSE$/, // legal text with the author's name
  /^\.github\/.+\.yml$/, // dogfooded output (has generated comments)
  /\/__snapshots__\// // generated fixtures
]

const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|zip|pdf|lock)$/i

/** Tracked files plus untracked ones that are not ignored, so the check works before a commit. */
const listFiles = () => {
  const run = ( args ) => execFileSync( "git", args, { encoding: "utf8" } ).split( "\0" ).filter( Boolean )
  return [ ...new Set( [ ...run( [ "ls-files", "-z" ] ), ...run( [ "ls-files", "-z", "--others", "--exclude-standard" ] ) ] ) ]
}

const describe = ( ch ) => `U+${ ch.codePointAt( 0 ).toString( 16 ).toUpperCase().padStart( 4, "0" ) } ${ ch }`

const violations = []

for ( const file of listFiles() ) {
  if ( ALLOWLIST.some( ( re ) => re.test( file ) ) ) continue
  if ( BINARY.test( file ) ) continue

  let text
  try {
    text = readFileSync( file, "utf8" )
  } catch {
    continue // deleted from the worktree but still tracked
  }
  if ( !/[^\x00-\x7F]/u.test( text ) ) continue

  text.split( /\r?\n/ ).forEach( ( line, index ) => {
    for ( const ch of line ) {
      if ( ch.codePointAt( 0 ) > 0x7f ) violations.push( `${ file }:${ index + 1 }: ${ describe( ch ) }` )
    }
  } )
}

if ( violations.length > 0 ) {
  console.error( "Non-ASCII characters found in source files:" )
  for ( const v of violations ) console.error( `  ${ v }` )
  console.error( `\n${ violations.length } violation(s). Move the text into src/assets/lang/*.yaml.` )
  process.exit( 1 )
}

console.log( "check:ascii - OK" )
