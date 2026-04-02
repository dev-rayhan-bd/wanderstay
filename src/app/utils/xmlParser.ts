import xml2js from 'xml2js';

export const jsonToXml = (json: any) => {
  const builder = new xml2js.Builder({
    renderOpts: { pretty: false },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    attrkey: '$' // এটি দিয়ে <tag attr="value"> ফরম্যাট করা হয়
  });
  return builder.buildObject(json);
};

export const xmlToJson = async (xml: string) => {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true
  });
  return await parser.parseStringPromise(xml);
};