# ============================================================
# Exercises 07: Album (make_album)
# 'tracks' is OPTIONAL with default None ("no value given").
# The key is only added to the dictionary when a real number
# is passed. The function RETURNS a dictionary.
# ============================================================


def make_album(artist, title, tracks=None):
    """Build a dictionary describing a music album."""
    album = {"artist": artist.title(), "title": title.title()}
    if tracks is not None:
        album["tracks"] = tracks
    return album


print(make_album("the beatles", "abbey road"))
print(make_album("coldplay", "parachutes"))
print(make_album("eminem", "the eminem show", tracks=20))
