'use client'

import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { useTheme } from 'next-themes'


type Props = {
  onSelect: (emoji: string) => void
}

export default function EmojiPickerPopover({ onSelect }: Props) {
    const {theme}= useTheme();
  return (
    <div className='absolute bottom-full mb-2 left-0 z-50 '>
        <EmojiPicker
      onEmojiClick={(emoji: EmojiClickData) => {
        onSelect(emoji.emoji)
      }}
      theme={theme==="dark" ? Theme.DARK : Theme.LIGHT }
      searchDisabled={false}
      lazyLoadEmojis
    />
    </div>
  )
}
