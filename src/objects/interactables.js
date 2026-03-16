/**
 * Interactable objects in the room.
 *
 * To add a new one, copy an entry and change the values:
 *   tileX / tileY  — position on the 20x20 grid (must be an interior floor tile)
 *   textureKey     — which preloaded texture to render as the sprite
 *   imageUrl       — path to an image shown inside the modal (null = no image)
 *   title          — bold heading in the modal
 *   text           — body text in the modal
 *
 * Example for a second object:
 * {
 *   tileX: 5, tileY: 3,
 *   textureKey: 'bookshelf',
 *   imageUrl: '/assets/book_photo.jpg',
 *   title: 'Our Favourite Book',
 *   text: 'We read this together on a rainy afternoon.',
 * },
 */
export const INTERACTABLE_DATA = [
  {
    tileX: 10,
    tileY: 1,
    textureKey: 'photoframe',
    imageUrl: '/assets/images/first_date.jpg',               // swap with e.g. '/assets/photo.jpg'
    title: 'Our First Adventure',
    text: 'A photo from the day everything started. Some memories are worth keeping forever.',
  },
];
