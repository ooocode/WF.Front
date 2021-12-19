export function highlightText(text: string, keywords: string[]) {
    keywords.forEach(keyword => {
        text = text.replace(keyword, `<span style="color:red">${keyword}</span>`)
    })
    return text
}