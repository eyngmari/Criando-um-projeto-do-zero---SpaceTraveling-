import Link from 'next/link';
import Header from '../components/Header';
import Prismic from'@prismicio/client';
import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from 'react-icons/fi'
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { useState } from 'react';

import ptBR from 'date-fns/locale/pt-BR'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleNewPagePosts() {
    const postsResponse = await fetch(nextPage).then(response => response.json());

    const newPosts = postsResponse.results.map((post: Post) => ({
      uid: post.uid,
      first_publication_date: format(new Date(post.first_publication_date),
      "dd MMM yyyy",
      {
        locale: ptBR
      }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts(posts.concat(newPosts));
    setNextPage(postsResponse.next_page);
  }

  return (
    <>
      <Header/>

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map((post, index) => (
            <Link key={index} href={`/post/${post.uid}`}>
              <a key={post.uid}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <FiCalendar className={styles.icon}/>
                  <time>
                    {
                      format(new Date(post.first_publication_date),
                      "dd MMM yyyy",
                      {
                        locale: ptBR
                      })
                    }
                  </time>
                  <FiUser className={styles.icon}/>
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>

          ))}
        </div>
        <div>
          {nextPage && (
            <button className={styles.load} onClick={handleNewPagePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      } 
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  }

  return {
    props: {
      postsPagination
    }
  }
};
