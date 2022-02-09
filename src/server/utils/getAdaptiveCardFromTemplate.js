const { Template } = require('adaptivecards-templating');

function getAdaptiveCardFromTemplate(cardTemplate, params) {
  const template = new Template(cardTemplate);
  const card = template.expand({
    $root: params
  });
  return card;
}

exports.getAdaptiveCardFromTemplate = getAdaptiveCardFromTemplate;
