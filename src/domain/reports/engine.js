import vm from 'vm';
import handlebars from 'handlebars';

const engine = {
  handlebars,
  renderTemplate,
  sandboxEval,
  compile,
};

function renderTemplate(template, context) {
  return compile(template)(context);
}

function compile(template) {
  return handlebars.compile(template);
}

function sandboxEval(script) {
  const sandbox = new vm.createContext();
  vm.runInContext(`result = (${script});`, sandbox);
  return sandbox.result;
}


export default engine;
