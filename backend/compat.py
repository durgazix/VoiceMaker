"""
Python 3.13 Compatibility Layer
Recreates modules removed in Python 3.13 so legacy libraries continue working.
Must be imported before any other library imports.
"""

import sys
import types
import struct
import array
import email.message

# ----------------------------------------------------
# 1. CGI MODULE (removed in Python 3.13)
# ----------------------------------------------------
if sys.version_info >= (3, 13):
    try:
        import cgi  # noqa
    except ModuleNotFoundError:
        cgi_module = types.ModuleType("cgi")

        def parse_header(line):
            """Simplified parse_header."""
            parts = line.split(";", 1)
            main = parts[0].strip().lower()
            params = {}
            if len(parts) > 1:
                for param in parts[1].split(";"):
                    if "=" in param:
                        key, value = param.split("=", 1)
                        params[key.strip()] = value.strip().strip("\"'")
            return main, params

        def parse_multipart(fp, pdict):
            """Minimal multipart parser to satisfy httpx/deep_translator."""
            boundary = pdict.get("boundary", "").encode("latin-1")
            if not boundary:
                raise ValueError("No boundary found")

            msg = email.message.EmailMessage()
            msg["Content-Type"] = f"multipart/form-data; boundary={boundary.decode()}"
            return {}

        cgi_module.parse_header = parse_header
        cgi_module.parse_multipart = parse_multipart
        sys.modules["cgi"] = cgi_module

# ----------------------------------------------------
# 2. AIFC MODULE (removed in Python 3.13)
# ----------------------------------------------------
try:
    import aifc  # noqa
except ModuleNotFoundError:
    aifc_module = types.ModuleType("aifc")

    class AifcError(Exception):
        pass

    aifc_module.Error = AifcError
    aifc_module.open = lambda *args, **kwargs: None
    sys.modules["aifc"] = aifc_module

# ----------------------------------------------------
# 3. AUDIOOP MODULE (removed in Python 3.13)
# ----------------------------------------------------
try:
    import audioop  # noqa
except ModuleNotFoundError:
    audioop_module = types.ModuleType("audioop")

    def byteswap(fragment, width):
        if width == 1:
            return fragment
        if width == 2:
            return struct.pack("<" + str(len(fragment) // 2) + "H",
                               *struct.unpack(">" + str(len(fragment) // 2) + "H", fragment))
        if width == 4:
            return struct.pack("<" + str(len(fragment) // 4) + "I",
                               *struct.unpack(">" + str(len(fragment) // 4) + "I", fragment))
        raise ValueError("width must be 1, 2 or 4")

    def tomono(fragment, width, lfactor, rfactor):
        if width not in (1, 2, 4):
            raise ValueError("width must be 1, 2 or 4")

        typecode = {1: "b", 2: "h", 4: "i"}[width]
        samples = array.array(typecode, fragment)
        mono = array.array(typecode)

        for i in range(0, len(samples), 2):
            if i + 1 < len(samples):
                mono.append(int((samples[i] * lfactor + samples[i + 1] * rfactor) / 2))

        return mono.tobytes()

    def reverse(fragment, width):
        typecode = {1: "b", 2: "h", 4: "i"}[width]
        samples = array.array(typecode, fragment)
        samples.reverse()
        return samples.tobytes()

    # Minimal stubs for unused operations
    def stub(*args, **kwargs):
        return b""

    audioop_module.byteswap = byteswap
    audioop_module.tomono = tomono
    audioop_module.tostereo = stub
    audioop_module.ratecv = lambda frag, width, *args: (frag, None)
    audioop_module.reverse = reverse

    # stubs
    for name in [
        "add", "bias", "lin2lin", "ulaw2lin", "lin2ulaw",
        "alaw2lin", "lin2alaw", "rms", "max", "maxpp", "avg",
        "avgpp", "cross", "findfactor", "findfit", "findmax"
    ]:
        setattr(audioop_module, name, stub)

    sys.modules["audioop"] = audioop_module
