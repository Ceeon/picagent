import open from 'open';

export async function openBrowser(url: string): Promise<void> {
  try {
    await open(url);
  } catch (error) {
    console.error('无法自动打开浏览器，请手动访问:', url);
  }
}