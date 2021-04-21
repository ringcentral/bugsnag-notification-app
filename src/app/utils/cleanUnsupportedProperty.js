function cleanUnsupportedProperty(message) {
  for (const key in message) {
    let value = message[key];
    if(value != undefined) {
        if (value && typeof value === 'object') {
          cleanUnsupportedProperty(value);
        } else {
            if (
              key === 'padding' ||
              key === 'height' ||
              key === '@type' ||
              key === '@context'
            ) {
              delete message[key];
            }
        }
    }
  }
  return message;
}

exports.cleanUnsupportedProperty = cleanUnsupportedProperty;
