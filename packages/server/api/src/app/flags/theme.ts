import tinycolor from 'tinycolor2'

function generateColorVariations(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)

    const darkColor = defaultColorObj.clone().darken(2)
    const baseLight = tinycolor('#ffffff')
    const lightColor = tinycolor
        .mix(baseLight, defaultColorObj.toHex(), 12)
        .toHexString()
    const mediumColor = defaultColorObj.clone().lighten(26)

    return {
        default: defaultColorObj.toHexString(),
        dark: darkColor.toHexString(),
        light: lightColor,
        medium: mediumColor.toHexString(),
    }
}

function generateSelectionColor(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)
    const lightColor = defaultColorObj.lighten(8)
    return lightColor.toHexString()
}

export function generateTheme({
    primaryColor,
    fullLogoUrl,
    favIconUrl,
    logoIconUrl,
    websiteName,
}: {
    primaryColor: string
    fullLogoUrl: string
    favIconUrl: string
    logoIconUrl: string
    websiteName: string
}) {
    return {
        websiteName,
        colors: {
            avatar: '#515151',
            'blue-link': '#1890ff',
            danger: '#f94949',
            primary: generateColorVariations(primaryColor),
            warn: {
                default: '#f78a3b',
                light: '#fff6e4',
                dark: '#cc8805',
            },
            success: {
                default: '#14ae5c',
                light: '#3cad71',
            },
            selection: generateSelectionColor(primaryColor),
        },
        logos: {
            fullLogoUrl,
            favIconUrl,
            logoIconUrl,
        },
    }
}

export const defaultTheme = generateTheme({
    primaryColor: '#6e41e2',
    websiteName: 'Kallabot',
    fullLogoUrl: 'https://media-hosting.imagekit.io//58485df61d13416f/White%20(5).png?Expires=1832088330&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=Tzr0gfA7CeFcVVYmg0Yx8wVa0lsj~XFUIfQwM1sKeK7fSfFrEy-KcJFEiUkrsdZuNd25LWwsyrAr61YHhvRTUK9Kj~Yogbh7X4PEyQBP7qfRQ4I0mlmxWu-3AF~Uz7wnLVuWZJ~cbRWkjugbsUBOK1QhM6TNmhJrpvwF3s8TTMUcAVYxS64v9CgiYRttc6p~HT04pes9mziSctUWwLK9QWzwPzTFGk3C5Ew~2dUuADWdLnAXwwhPfQgXaroZnOTfYbEb0GUxgk1mFBl2upEA6P4mwZu8dS-cWXmtRK9rOAh3valkZXYs2E4ruxZVBgGRvOWm6XRYUxZglOpdfnTmIQ__',
    favIconUrl: 'https://media-hosting.imagekit.io//60166f46183f4b2f/White%20(11).png?Expires=1832088361&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=rQyWySGVtRl7X8~-~~h~mCfxKbBqZmnQd-BDZzWWjRKDZjwXtzuKtBALGBuJHobl1Ihzz1oON3LL81ceeHvb~6m4ngakV0dzAtAkEuXNajnHZllqWy9jtrykTYp5Ui7Ziduk~QUfsm0~6aPnn8a72fcR-0lDHJEVD-KLWgEI1kBiMZDVcd0KdtBmpeSGlFva6gmGFZR8jWDt42Jcj342V8RoEJfDTg5Uqasxrv6K4z01fIGHwHpIZhJp9vRB24BfZczJZ4Y~vY8RPPzfBIk~xYA~V0oLou5A3e~divuCmNXp-DQbKyJwWzF5pZZHlbSLNdfcbyKPSUandJOOMurlyw__',
    logoIconUrl: 'https://media-hosting.imagekit.io//60166f46183f4b2f/White%20(11).png?Expires=1832088361&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=rQyWySGVtRl7X8~-~~h~mCfxKbBqZmnQd-BDZzWWjRKDZjwXtzuKtBALGBuJHobl1Ihzz1oON3LL81ceeHvb~6m4ngakV0dzAtAkEuXNajnHZllqWy9jtrykTYp5Ui7Ziduk~QUfsm0~6aPnn8a72fcR-0lDHJEVD-KLWgEI1kBiMZDVcd0KdtBmpeSGlFva6gmGFZR8jWDt42Jcj342V8RoEJfDTg5Uqasxrv6K4z01fIGHwHpIZhJp9vRB24BfZczJZ4Y~vY8RPPzfBIk~xYA~V0oLou5A3e~divuCmNXp-DQbKyJwWzF5pZZHlbSLNdfcbyKPSUandJOOMurlyw__',
})
