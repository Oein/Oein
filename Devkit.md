# Oein's Devkit

# TOC

* Next.JS
  * Styles
    - [HappyFont](#happyfont)
  * Next Auth
    - [Next Auth Attach id to Session](#nextauth-attach-id-to-session)
    - [Next Auth Prisma Scheme](#next-auth-prisma-scheme)
    - [Next Auth _app.tsx](#next-auth-_apptsx)
  * Prisma
    - [Global Prisma](#global-prisma)
  * Components
    - [HTML Renderer](#html-renderer)
    - [EZInfscroll](#ezinfscroll)
      + [Example](#ezinfscroll-example)
  * [Material Icons](#material-icons)
  * [styles2css(css.oein.kr)](https://css.oein.kr/)
 
 

## HappyFont

```css
@import "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.6/dist/web/variable/pretendardvariable.css";
@font-face {
  font-family: LINESeedKR-Bd;
  src: url(https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.0/LINESeedKR-Bd.woff2)
    format("woff2");
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: LINESeedKR-Rg;
  src: url(https://cdn.jsdelivr.net/gh/wizfile/font/LINESeedKR-Rg.eot);
  src: url(https://cdn.jsdelivr.net/gh/wizfile/font/LINESeedKR-Rg.woff)
    format("woff");
  font-style: normal;
}

@font-face {
  font-family: LINESeedKR-Th;
  src: url(https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.0/LINESeedKR-Th.woff2)
    format("woff2");
  font-weight: 700;
  font-style: normal;
}

body {
  font-family: LINESeedKR-Rg, Pretendard Variable, Pretendard, -apple-system,
    BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, Segoe UI,
    Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, "Apple Color Emoji",
    "Segoe UI Emoji", Segoe UI Symbol, sans-serif;
}

.bold {
  font-family: LINESeedKR-Bd, Pretendard Variable, Pretendard, -apple-system,
    BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, Segoe UI,
    Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, "Apple Color Emoji",
    "Segoe UI Emoji", Segoe UI Symbol, sans-serif;
}

.thin {
  font-family: LINESeedKR-Th, Pretendard Variable, Pretendard, -apple-system,
    BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, Segoe UI,
    Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, "Apple Color Emoji",
    "Segoe UI Emoji", Segoe UI Symbol, sans-serif;
}
```

## NextAuth Attach id to Session

**types/nextauth.d.ts**
```ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

**pages/api/auth/\[...nextauth\].ts**
```ts
session: async ({ session, token, user }) => {
  if (session?.user) {
    session.user.id = user.id;
  }
  return session;
},
```

## HTML Renderer

```tsx
export default function HTMLRenderer(props: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: props.html }} />;
}
```

## Global Prisma

```tsx
import { PrismaClient } from "@prisma/client";
declare global {
  var prismadb: PrismaClient | undefined;
}

const prismadb = globalThis.prismadb || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prismadb = prismadb;

export default prismadb;
```

## Next Auth Prisma Scheme

```prisma
model Account {
  id                 String  @id @default(cuid())
  userId             String  @unique
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

# Next Auth \_app.tsx

```tsx
export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
```

# Material Icons

**global.css**

```css
.material-symbols-outlined {
  width: 44px;
  height: 44px;
  color: black;
  font-family: "Material Icons";
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48;
  pointer-events: none;
}
```

**\_document.tsx**

```tsx
<Head>
  <link
    href="https://fonts.googleapis.com/icon?family=Material+Icons"
    rel="stylesheet"
  />
</Head>
```
# EZInfscroll

```tsx
import { useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

export default function InfScroll<T>(props: {
  fetchData: (cursor?: any) => Promise<{
    data: T[];
    cursor?: any;
    hasMore?: boolean;
  }>;
  loader?: JSX.Element;
  dataMapper?: (data: T, index: number) => JSX.Element;
  minDataCount?: number;
}) {
  return function InfScrollElement() {
    const [datas, setDatas] = useState<T[]>([]);
    const cursorRef = useRef(null);
    const hasRef = useRef(true);
    const fetchData = () => {
      if (hasRef.current)
        props.fetchData(cursorRef.current).then((v) => {
          setDatas((oldDatas) => [...oldDatas, ...v.data]);
          cursorRef.current = v.cursor;
          let nhm =
            v.hasMore ||
            (props.minDataCount
              ? v.data.length >= props.minDataCount
              : undefined);

          if (nhm == undefined) throw new Error("No has more data has given.");
          hasRef.current = nhm;
        });
    };
    useEffect(() => {
      fetchData();
    }, []);

    return (
      <InfiniteScroll
        dataLength={datas.length}
        next={fetchData}
        hasMore={hasRef.current}
        loader={props.loader || <h4>Loading...</h4>}
      >
        {props.dataMapper
          ? datas.map(props.dataMapper)
          : datas.map((v, i) => {
              return <div key={i}>{JSON.stringify(v)}</div>;
            })}
      </InfiniteScroll>
    );
  };
}
```

### EZInfscroll Example

```tsx
import InfScroll from "@/components/inf";
import axios from "axios";

export default function Example() {
  return (
    <>
      {InfScroll<{
        name: string;
        age: number;
        comment: string;
      }>({
        fetchData: async (cursor?: any) => {
          let ncur = cursor || 0;
          let { data } = await axios.get("/api/step13?page=" + ncur);
          return {
            data: data,
            cursor: ncur + 1,
          };
        },
        dataMapper: (data: any) => {
          return <div>{data.name}</div>;
        },
        minDataCount: 25,
      })()}
    </>
  );
}
```
