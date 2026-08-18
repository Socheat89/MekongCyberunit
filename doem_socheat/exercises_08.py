# ============================================================
# Exercises 08: User Albums (interactive loop)
# A WHILE loop asks for input and calls make_album() each
# round. Typing 'q' for either answer quits the loop.
# ============================================================


def make_album(artist, title, tracks=None):
    """Build a dictionary describing a music album."""
    album = {"artist": artist.title(), "title": title.title()}
    if tracks is not None:
        album["tracks"] = tracks
    return album


while True:
    print("\nEnter an album (or 'q' to quit):")
    artist_name = input("Artist: ")
    if artist_name.lower() == "q":
        break
    album_title = input("Album title: ")
    if album_title.lower() == "q":
        break
    print(make_album(artist_name, album_title))
