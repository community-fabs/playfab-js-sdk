import { wordWrap, lowerFirst } from './utils.js';

function generateApiSummaryLines(apiElement, summaryParam, linkToDocs, docName = "") {
  let fullSummary;
  if (!apiElement[summaryParam]) {
    fullSummary = [""];
  } else if (!Array.isArray(apiElement[summaryParam])) {
    fullSummary = [apiElement[summaryParam]];
  } else {
    fullSummary = apiElement[summaryParam];
  }
  let lines;
  const joinedSummary = fullSummary.join(" ");
  const wrappedSummary = wordWrap(joinedSummary);
  if (wrappedSummary && wrappedSummary.length > 0) {
    lines = wrappedSummary.split("\n");
  } else {
    lines = [];
  }

  // Add extra documentation lines linking to PlayFab documentation
  const apiName = apiElement.url?.split("/")[1];
  if (linkToDocs && apiElement.url) {
    lines.push('')
    const apiCategory = apiElement.subgroup.toLowerCase().replaceAll(" ", "-");
    const fullApiUrl = "https://docs.microsoft.com/rest/api/playfab/" + apiName.toLowerCase() + "/" + apiCategory + "/" + apiElement.name.toLowerCase();
    lines.push(`{@link ${fullApiUrl} Microsoft Documentation}`);
  }

  // Add extra documentation lines about deprecation
  if (apiElement.deprecation) {
    if (apiElement.deprecation.ReplacedBy != null)
      lines.push(`@deprecated Please use ${apiElement.deprecation.ReplacedBy} instead.`);
    else
      lines.push("@deprecated Do not use");
  }


  if (!apiElement.deprecation && apiElement.requestExample && apiName) {
    const exampleLines = apiElement.requestExample.replaceAll('*/', '*\\/').split('\n');
    const examplePrefix = `await ${lowerFirst(docName)}Client.${lowerFirst(apiElement.name)}(`;
    const exampleSuffix = ');';

    lines.push('@example');
    if (exampleLines.length > 1) {
      lines.push(`${examplePrefix}${exampleLines.at(0)}`);
      for (let i = 1; i < exampleLines.length - 1; i++) {
        lines.push(exampleLines[i]);
      }
      lines.push(`${exampleLines.at(-1)}${exampleSuffix}`);
    } else {
      lines.push(`${examplePrefix}${exampleLines.at(0)}${exampleSuffix}`)
    }
  }

  if (lines.at(-1) === '') {
    lines.pop();
  }

  return lines;
}

export function generateApiSummary(tabbing, apiElement, summaryParam, addDocsLink = false, docName = "") {
  const lines = generateApiSummaryLines(apiElement, summaryParam, addDocsLink, docName);

  for (var i = 0; i < lines.length; i++)
    if (lines[0]?.includes("*/"))
      return ""; // Can't support end-JS block-comment in our JS comments

  var output;
  if (lines.length === 1 && lines[0]) {
    output = tabbing + "/** " + lines[0] + " */\n";
  } else if (lines.length > 1) {
    output = tabbing + "/**\n" + tabbing + " * " + lines.join("\n" + tabbing + " * ") + "\n" + tabbing + " */\n";
  } else {
    output = "";
  }
  return output;
}

export function getBaseType(datatype) {
  if (datatype.isRequest)
    return " extends IPlayFabRequestCommon";
  if (datatype.isResult)
    return " extends IPlayFabResultCommon";
  return "";
}

export function getPropertyType(property, datatype) {
  let output;

  if (property.actualtype === "String")
    output = "string";
  else if (property.actualtype === "Boolean")
    output = "boolean";
  else if (property.isclass || property.isenum)
    output = property.actualtype;
  else if (property.actualtype.includes("int") || property.actualtype === "float" || property.actualtype === "double")
    output = "number";
  else if (property.actualtype === "DateTime")
    output = "string";
  else if (property.actualtype === "object")
    output = "any";
  else
    throw "Unknown property type: " + property.actualtype + " for " + property.name + " in " + datatype.className;

  if (property.collection === "array")
    output += "[]";
  else if (property.collection === "map" && output === "string")
    output = "Record<string, " + output + " | null>"; // Null is frequently a valid dict-value, and we can't distinguish when it's not at this time
  else if (property.collection === "map")
    output = "Record<string, " + output + ">";
  else if (property.collection)
    throw "Unknown collection type: " + property.collection + " for " + property.name + " in " + datatype.className;

  let isOptional = property.optional;
  // TitleId is required at the API level, but optional at the SDK level, because we automagically provide it from settings
  const isLoginRequest = ((datatype.name.includes("Login") && datatype.isRequest) || datatype.name === "RegisterPlayFabUserRequest");
  if (isLoginRequest && property.name === "TitleId") {
    isOptional = true;
  }

  return (isOptional ? "?" : "") + ": " + output;
}

export function getAuthParams(apiCall) {
  if (apiCall.url === "/Authentication/GetEntityToken")
    return "\"AuthKey\"";
  if (["EntityToken", "SessionTicket", "SecretKey"].includes(apiCall.auth))
    return `"${apiCall.auth}"`;

  return null;
}

export function getRequestActions(tabbing, apiCall) {
  if (apiCall.url === "/Authentication/GetEntityToken")
    return tabbing + "let authKey: string | undefined = undefined;\n"
      + tabbing + "let authValue: string | undefined = undefined;\n"
      + tabbing + "if (!authKey && playfab.sessionTicket) {\n"
      + tabbing + "  let authInfo = playfab.getAuthInfo(request, \"SessionTicket\");\n"
      + tabbing + "  authKey = authInfo.header, authValue = authInfo.authValue;\n"
      + tabbing + "}\n"
      + tabbing + "if (!authKey && playfab.config.developerSecretKey) {\n"
      + tabbing + "  let authInfo = playfab.getAuthInfo(request, \"SecretKey\");\n"
      + tabbing + "  authKey = authInfo.header, authValue = authInfo.authValue;\n"
      + tabbing + "}\n";
  if (apiCall.result === "LoginResult" || apiCall.request === "RegisterPlayFabUserRequest")
    return tabbing + "request.TitleId = playfab.config.titleId ? playfab.config.titleId : request.TitleId;\n"
      + tabbing + "if (!request.TitleId) throw ErrorMessages.titleId;\n"
      + tabbing + "// this.authenticationContext can be modified by other asynchronous login attempts\n"
      + tabbing + "// Deep-copy the authenticationContext here to safely update it\n"
      + tabbing + "let authenticationContext = JSON.parse(JSON.stringify(playfab.authContext));\n";
  return "";
}

export function getResultActions(tabbing, apiCall) {
  if (apiCall.result === "LoginResult" || apiCall.result === "RegisterPlayFabUserResult")
    return tabbing + "if (result) {\n"
      + tabbing + "  if(result?.SessionTicket) {\n"
      + tabbing + "    playfab.sessionTicket = result.SessionTicket;\n"
      + tabbing + "  }\n"
      + tabbing + "  if (result?.EntityToken?.EntityToken) {\n"
      + tabbing + "    playfab.entityToken = result.EntityToken.EntityToken;\n"
      + tabbing + "  }\n"
      + tabbing + "  // Apply the updates for the AuthenticationContext returned to the client\n"
      + tabbing + "  authenticationContext = playfab.updateAuthContext(authenticationContext, result);\n"
      + tabbing + "}";
  if (apiCall.url === "/Authentication/GetEntityToken")
    return tabbing + "if (result?.EntityToken)\n"
      + tabbing + "  playfab.entityToken = result.EntityToken;";
  if (apiCall.url === "/GameServerIdentity/AuthenticateGameServerWithCustomId")
    return tabbing + "if (result?.EntityToken?.EntityToken)\n"
      + tabbing + "  playfab.entityToken = result.EntityToken.EntityToken;";
  return "";
}

