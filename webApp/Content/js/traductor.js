function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            includedLanguages: 'en,es',
            layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL
        },
        'google_translate_element'
    );
}

