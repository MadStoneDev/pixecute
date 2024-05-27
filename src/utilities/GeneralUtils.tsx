const encodedUrl = (value: string) => {
  let valueString = JSON.stringify(value);
  let valueBase64 = btoa(`new=${valueString}`);
  return encodeURIComponent(valueBase64);
};

const decodedUrl = (value: string) => {
  let valueBase64 = decodeURIComponent(value);
  let valueString = atob(valueBase64);
  return JSON.parse(valueString);
};

export { encodedUrl, decodedUrl };
