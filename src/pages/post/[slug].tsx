import Header from '../../components/Header';
import Prismic from'@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import { getPrismicClient } from '../../services/prismic';
import { format } from 'date-fns';

import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>
  }
  return (
    <>
      <Header/>

      <div className={styles.image}>
        <img src={post.data.banner.url} alt="" /> 
      </div>

      <main className={commonStyles.container}>
        <article className={styles.posts}>
          
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <FiCalendar className={styles.icon}/>
            <time>{post.first_publication_date}</time>
            <FiUser className={styles.icon}/>
            <span>{post.data.author}</span>
            <FiClock className={styles.icon}/>
            <span>
              {
                Math.ceil(post.data.content.reduce((acc, cur) => {
                  let body = RichText.asText(cur.body);
                  body = body.replace(/\u00a0/g, " ");
                  const wordsBody = body.split(/[ ,]+/);
                  const wordsHeading = cur.heading.split(/[ ,]+/);
                  return acc + wordsBody.length + wordsHeading.length;
                }, 0)/200)
              } min
            </span>
          </div>
          <div className={styles.content}>
            {post.data.content.map((content, index) => (
              <div key={index} className={styles.text}>
                <strong>{content.heading}</strong>
                {content.body.map((body, indexBody) => (
                  <p key={indexBody}>
                    {body.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: [],
    pageSize: 1,
  });
  
  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params
  const prismic = getPrismicClient();
  
  const post = await prismic.getByUID('post', String(slug), {});
  
  post.first_publication_date = format(
    new Date(post.first_publication_date),
    "dd MMM yyyy",
    {
      locale: ptBR
    }
  )

  return {
    props: {
      post,
    },
    redirect: 60 * 60 * 24, //1 day
  }
};