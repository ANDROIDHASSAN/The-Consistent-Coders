import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HowItWorks } from '../components/HowItWorks';
import { Sessions } from '../components/Sessions';
import { Comparator } from '../components/Comparator';
import { CraftModal } from '../components/CraftModal';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Seo } from '../seo/Seo';
export const BuildPage = () => {
    const [modalData, setModalData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCardClick = (card) => {
        setModalData(card);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setModalData(null), 300);
    };
    return (<>
      <Seo title="Build Real Projects in Teams — Sessions, Sprints and Proof of Work" description="Build portfolio-worthy projects with other developers: weekly sessions, team sprints and shipped work you can show recruiters. Then post or apply for jobs on the community directory." path="/build" jsonLd={Breadcrumbs.schema([{ name: 'Build', path: '/build' }])} />
      <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 1.5rem)' }}>
        <Breadcrumbs items={[{ name: 'Build', path: '/build' }]} />
        <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.6rem)' }}>Build real projects <em>in teams</em></h1>
        <p className="page-lede">Weekly sessions, team sprints, shipped work you can show a recruiter — then <Link to="/jobs">apply</Link> with it.</p>
      </div>
      <HowItWorks />
      <Sessions onCardClick={handleCardClick}/>
      <Comparator />
      <CraftModal isOpen={isModalOpen} onClose={closeModal} data={modalData}/>
      <Cta title="Built something? Put it in front of a hiring manager." text="Add the live link to your application note. Posters see it first." />
      <Footer />
    </>);
};
