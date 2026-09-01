declare module 'react-native-katex';



declare module 'markdown-it-mathjax' {
  import MarkdownIt from 'markdown-it';
  const mathjax: MarkdownIt.PluginSimple;
  export default mathjax;
}
