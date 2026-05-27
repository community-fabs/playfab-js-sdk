import { Eta } from "eta"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateSdkGlobals } from "./sdk-globals.js";
import { generateApiSummary, getBaseType, getPropertyType, getAuthParams, getRequestActions, getResultActions } from "./sdk-utils.js";

console.time("SDK generated")

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sdkDir = path.join(__dirname, "..");
const templatesDir = path.join(__dirname, "sdk", "templates");
const staticDir = path.join(__dirname, "sdk", "static");

const eta = new Eta({ views: templatesDir })

function updatePackageVersion(newVersion) {
  try {
    const packagePath = path.join(sdkDir, "package.json");
    const rawData = fs.readFileSync(packagePath, 'utf8');
    const packageObj = JSON.parse(rawData);

    packageObj.version = newVersion;
    
    const updatedData = JSON.stringify(packageObj, null, 2);
    
    fs.writeFileSync(packagePath, updatedData, 'utf8');
  } catch (error) {
    console.error('Error handling package.json:', error);
  }
}

function cleanSdk() {
  fs.rmSync(path.join(sdkDir, "dist"), { recursive: true, force: true });
  fs.rmSync(path.join(sdkDir, "src", "apis"), { recursive: true, force: true });
  fs.rmSync(path.join(sdkDir, "src", "types"), { recursive: true, force: true });
}

function copyStaticFiles() {
  fs.cpSync(staticDir, sdkDir, { recursive: true });
}

function renderTemplatesToDir(srcDir, destDir, renderData) {
  fs.readdirSync(srcDir, { withFileTypes: true }).forEach(dirent => {
    if (dirent.name.startsWith("__")) {
      return;
    }
    const srcPath = path.join(srcDir, dirent.name);
    const destPath = path.join(destDir, dirent.name.replace(/\.eta$/, ''));
    if (dirent.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      renderTemplatesToDir(srcPath, destPath, renderData);
    } else if (dirent.isFile() && dirent.name.endsWith('.eta')) {
      const relPath = path.relative(templatesDir, srcPath);
      const rendered = eta.render(relPath, renderData);
      fs.writeFileSync(destPath, rendered);
    }
  });
}

function generateDatatype(datatype) {
  const interfaceTemplate = path.relative(templatesDir, path.join(templatesDir, "src", "types", "__Interface.eta"));
  const enumTemplate = path.relative(templatesDir, path.join(templatesDir, "src", "types", "__Enum.eta"));

  if (datatype.isenum) {
    return eta.render(enumTemplate, { datatype });
  }
  return eta.render(interfaceTemplate, {
    generateApiSummary,
    getBaseType,
    getPropertyType,
    datatype
  });
}

function renderCustomTemplates(renderData) {
  const { docs, ...globals } = renderData;

  const apiClientPath = path.relative(templatesDir, path.join(templatesDir, 'src', 'apis', '__PlayFab_Api.ts.eta'));
  const apiTypesPath = path.relative(templatesDir, path.join(templatesDir, 'src', 'types', '__PlayFab_Api.ts.eta'));

  for (const doc of docs) {
    // main source file
    const destClientPath = path.join(sdkDir, "src", "apis", `PlayFab${doc.name}Api.ts`);
    const usesSessionToken = doc.calls.some(call => call.auth === "SessionTicket");
    const renderedClient = eta.render(apiClientPath, { doc, ...globals, usesSessionToken })
    fs.writeFileSync(destClientPath, renderedClient);

    // generated types
    const destTypesPath = path.join(sdkDir, "src", "types", `PlayFab${doc.name}Api.ts`);
    const renderedTypes = eta.render(apiTypesPath, { doc, ...globals })
    fs.writeFileSync(destTypesPath, renderedTypes);
  }
}

async function getRenderData() {
  const sdkGlobals = await generateSdkGlobals()
  return {
    ...sdkGlobals,
    generateDatatype,
    generateApiSummary,
    getAuthParams,
    getRequestActions,
    getResultActions
  };
}

async function main() {
  if (!fs.existsSync(sdkDir)) {
    fs.mkdirSync(sdkDir, { recursive: true });
  } else {
    cleanSdk();
  }

  copyStaticFiles()

  const renderData = await getRenderData();

  renderTemplatesToDir(templatesDir, sdkDir, renderData);
  renderCustomTemplates(renderData);

  updatePackageVersion(renderData.publishVersion);

  console.timeEnd("SDK generated")
}

await main();