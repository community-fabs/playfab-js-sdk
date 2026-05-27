import { getBuildIdentifier, lowerFirst } from "./utils.js";

const {
  DOCS_LOCATION = "https://raw.githubusercontent.com/PlayFab/API_Specs/master",
  MAKE_METHOD = "makeCombinedAPI",
  PUBLISH_VERSION_SUFFIX = ""
} = process.env;
const SKIP_DOC_TAGS = ["Beta"];

async function getOpenAPIDoc(relPath) {
  const document = await fetch(`${DOCS_LOCATION}/${relPath}`);
  return await document.json();
}

async function getTableOfContents() {
  const tableOfContents = await fetch(`${DOCS_LOCATION}/TOC.json`);
  const { documents } = await tableOfContents.json();

  return documents
}

async function getPlayFabData() {
  const docsInfo = await getTableOfContents();

  const sdkDocInfo = docsInfo.find(doc => doc.name === 'SdkManualNotes');
  const { sdkVersion } = sdkDocInfo ? await getOpenAPIDoc(sdkDocInfo.relPath) : { sdkVersion: {} };

  const docs = await Promise.all(
    docsInfo.filter(doc => doc.sdkGenMakeMethods?.includes(MAKE_METHOD))
      .map(doc => getOpenAPIDoc(doc.relPath))
  );

  const finalDocs = docs.filter(doc =>
    !Array.isArray(doc.AnyInclusiveFlags) ||
    !doc.AnyInclusiveFlags.some(flag => SKIP_DOC_TAGS.includes(flag))
  )
  .sort((a, b) => a.name > b.name ? 1 : -1)
  .map(doc => ({
    ...doc,
    exportName: lowerFirst(doc.name),
    className: `PlayFab${doc.name}Api`
  }));

  return {
    sdkVersion: sdkVersion.javascript || 'unknown',
    docs: finalDocs
  }
}

export const generateSdkGlobals = async () => {
  const playfabData = await getPlayFabData();

  return {
    ...playfabData,
    publishVersion: PUBLISH_VERSION_SUFFIX ? `${playfabData.sdkVersion}-${PUBLISH_VERSION_SUFFIX}` : playfabData.sdkVersion,
    buildIdentifier: getBuildIdentifier("community-playfab-js-sdk"),
    verticalName: process.env.VERTICAL_NAME || ''
  }
}